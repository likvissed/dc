require 'rails_helper'

RSpec.describe ServersController, type: :controller do

  let(:admin_user) { create(:admin_user) }
  before { sign_in :user, admin_user }

  describe "#check_for_cancel" do
    subject { get :index, cancel: true }

    it "redirects to cancel path" do
      expect(subject).to redirect_to servers_path
    end
  end

  describe "#index" do
    let!(:server_1) { create(:server) }
    let!(:server_2) { create(:server) }

    context "when sends html request" do
      subject { get :index }
      before { subject }

      it "must create instance variable" do
        expect(assigns(:servers)).to be_kind_of(Server::ActiveRecord_Relation)
      end

      it "render index page" do
        expect(subject).to render_template :index
      end
    end

    context "when sends json request" do
      context "when filter selected" do
        let(:expected_servers) do
          servers = Server.select(:id, :name, :server_type_id, :location).where("server_type_id = ?", server_1.server_type.id)
          servers.as_json(include: { server_type: { only: :name } }).each do |s|
            s['DT_RowId'] = s['id']
            s['del']      = "<a href='/servers/#{s['id']}' class='text-danger' data-method='delete' rel='nofollow'
title='Удалить' data-confirm='Вы действительно хотите удалить \"#{s['name']}\"?'><i class='fa fa-trash-o fa-1g'></a>"
            s.delete('id')
            s.delete('server_type_id')
          end
        end
        subject { get :index, server_type_val: server_1.server_type.id, format: :json }

        it "sends filtered servers data" do
          parser = JSON.parse(subject.body)
          expect(parser["data"]).to eq expected_servers.as_json
        end
      end

      context "when filter not selected" do
        let(:expected_servers) do
          server = Server.select(:id, :name, :server_type_id, :location)
          server.as_json(include: { server_type: { only: :name } }).each do |s|
            s['DT_RowId'] = s['id']
            s['del']      = "<a href='/servers/#{s['id']}' class='text-danger' data-method='delete' rel='nofollow'
title='Удалить' data-confirm='Вы действительно хотите удалить \"#{s['name']}\"?'><i class='fa fa-trash-o fa-1g'></a>"
            s.delete('id')
            s.delete('server_type_id')
          end
        end
        let(:expected_server_types) { ServerType.select(:id, :name) }
        let(:parser) { JSON.parse(subject.body) }
        subject { get :index, server_type_val: 0, format: :json }

        it "sends all servers data" do
          expect(parser["data"]).to eq expected_servers.as_json
        end

        it "sends all servers_types data for create filter" do
          expect(parser["server_types"]).to eq expected_server_types.as_json
        end
      end
    end
  end

  describe "#show" do
    context "when sends json request" do
      let(:server) { create(:server) }
      let(:expected_server) do
        expect_server = Server.find(server.id)
        expect_server.as_json(
          include: {
            server_type: { only: :name },
            server_status: { only: :name },
            clusters: { only: :name },
            real_server_details: {
              only: :count,
              include: { server_part: { only: :name } } },
          },
          except: [:id, :created_at, :updated_at, :server_type_id, :cluster_id]
        )
      end
      subject { get :show, format: :json, id: server.id }

      it "sends the server data" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq expected_server
      end
    end
  end

  describe "#new" do
    subject { get :new }

    context "when sends html request" do
      context "when Server exists" do
        let!(:server_type) { create(:server_type) }

        it "must create a new variable" do
          subject
          expect(assigns(:server)).to be_a_new(Server)
        end

        it "renders new page" do
          expect(subject).to render_template(:new)
        end
      end

      context "when ServerType does not exist" do
        it "redirects to index action" do
          expect(subject).to redirect_to action: :index
        end
      end
    end

    context "when sends json request" do
      let!(:server_type) { create(:server_type) }
      let!(:server_status) { create(:server_status) }
      let(:server_types) { ServerType.select(:id, :name) }
      let(:server_statuses) { ServerStatus.select(:id, :name) }
      let(:expected_data) { { server_types: server_types, server_statuses: server_statuses } }
      subject { get :new, format: :json }

      it "sends the all server_types" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq expected_data.as_json
      end
    end
  end

  describe "#create" do
    context "when server was created" do
      let(:server_part_1) { create(:server_part) }
      let(:server_part_2) { create(:server_part) }
      let(:server_type) { create(:server_type) }
      let(:server_status) { create(:server_status) }
      let(:server) { attributes_for(:server, server_type_id: server_type.id, server_status_id: server_status.id, real_server_details_attributes: [
        { id: "", _destroy: "", server_part_id: server_part_1.id, count: 1 },
        { id: "", _destroy: "", server_part_id: server_part_2.id, count: 2 }
      ]) }

      subject { post :create, server: server }

      it "changes count of Server" do
        expect { subject }.to change { Server.count }.by(1)
      end

      it "changes count of RealServerDetail" do
        expect { subject }.to change { RealServerDetail.count }.by(2)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when server was not created" do
      let(:invalid_server) { build(:invalid_server).attributes }
      subject { post :create, server: invalid_server }

      it "must not change count of Server" do
        expect { subject }.to_not change { Server.count }
      end

      it "renders new page" do
        expect(subject).to render_template :new
      end
    end
  end

  describe "#edit" do
    let(:current_server) { create(:server) }

    context "when sends html request" do
      subject{ get :edit, name: current_server.name}
      before { subject }

      it "must create instance variable" do
        expect(assigns(:server)).to be_kind_of(Server)
      end

      it "check data in instance variable" do
        expect(assigns(:server)).to eq current_server
      end

      it "render edit page" do
        expect(subject).to render_template(:edit)
      end
    end

    context "when sends json request" do
      let!(:server_type) { create(:server_type) }
      let!(:server_status) { create(:server_status) }
      let!(:server_part) { create(:server_part) }
      let(:server_types) { ServerType.select(:id, :name) }
      let(:server_parts) { ServerPart.select(:id, :name) }
      let(:server_statuses) { ServerStatus.select(:id, :name) }
      let(:expected_server) do
        {
          server: current_server.as_json(
            include: {
              server_type: { only: [:id, :name] },
              server_status: { only: [:id, :name] }
            },
            except: [:created_at, :updated_at]
          ),
          server_details: current_server.real_server_details.as_json(
            include: { server_part: { except: [:created_at, :updated_at] } },
            except: [:created_at, :updated_at]
          ),
          server_parts: server_parts,
          server_types: server_types,
          server_statuses: server_statuses
        }
      end
      subject { get :edit, format: :json, name: current_server.name }

      it "sends the current server data" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq expected_server.as_json
      end
    end
  end

  describe "#update" do
    let(:server_old) { create(:server) }

    context "when server was updated" do
      let(:server_new) { build(:server).attributes }
      subject { put :update, name: server_old.name, server: server_new }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when server was not updated" do
      let(:invalid_server) { build(:invalid_server).attributes }
      subject { put :update, name: server_old.name, server: invalid_server }

      it "renders edit page" do
        expect(subject).to render_template :edit
      end
    end
  end

  describe "#destroy" do
    context "when server_type was destroyed" do
      let!(:server) { create(:server) }
      subject { delete :destroy, id: server.id }

      it "changes count of Server" do
        expect { subject }.to change { Server.count }.by(-1)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end
  end

end
require 'rails_helper'

RSpec.describe "clusters/index", type: :feature, js: true do

  let(:admin_user) { create(:admin_user) }
  let!(:clusters) { create_list(:cluster, 3) }
  let!(:cluster) { Cluster.first }
  before do
    login_as admin_user
    visit clusters_path
  end

  it "renders link to delete the record" do
    expect(page).to have_selector("a[href='#{cluster_path(cluster.id)}']")
  end

  it "renders \"add\" form to redirect to the create page" do
    expect(page).to have_selector("form[action='#{new_cluster_path}']")
  end

  context "when click on a cluster row" do
    before { page.first("#clusterTable tbody tr").click }

    it "shows modal window" do
      expect(page).to have_selector(".modal-content")
    end

    it "renders edit icon" do
      expect(page).to have_selector("a[href='/clusters/#{cluster.name}/edit']")
    end

    it "renders close button" do
      expect(page).to have_selector("button[data-id='closeModal']")
      # expect(page).to have_button("Закрыть")
    end

    it "sets type name in modal head" do
      expect(page.find('h4.modal-title').text).to eq cluster.name
    end

    context "shows structure of cluster in modal body" do
      let(:current_names) { page.find("#modal .modal-body").all("tr:not(:first-child)").map{ |td| td.find("td:first-child").text } }
      let(:expected_names) { cluster.servers.map(&:name) }

      it "shows server_part names" do
        expect(current_names).to eq expected_names
      end

      let(:current_types) { page.find("#modal .modal-body").all("tr:not(:first-child)").map{ |td| td.find("td:nth-child(2)").text } }
      let(:expected_typess) { cluster.node_roles.map(&:name) }

      it "shows server types" do
        expect(current_types).to eq expected_typess
      end
    end

    context "when click on the close button" do
      subject { click_button "Закрыть" }
      before do
        subject
        sleep 1
      end

      it "hides the modal frame" do
        expect(page.has_no_selector?("#modal")).to be_truthy
      end

      let(:row_count) { page.find("#modal .modal-body table[data-id='details']", visible: false).all("tr", visible: false).size }

      it "delete all created rows from the modal frame" do
        expect(row_count).to eq 1
      end
    end
  end

end

require 'rails_helper'

RSpec.describe "server_parts/index", type: :feature, js: true do

  let(:admin_user) { create(:admin_user) }
  let!(:servers) { create_list(:server_with_cluster, 5) }
  let!(:server) { Server.first }
  before do
    login_as admin_user
    visit servers_path
  end

  it "renders link to delete the record" do
    expect(page).to have_selector("a[href='#{server_path(server.id)}']")
  end

  it "renders \"add\" form to redirect to the create page" do
    expect(page).to have_selector("form[action='#{new_server_path}']")
  end

  context "when click on a server row" do
    before { page.first("#servTable tbody tr").click }

    it "shows modal window" do
      expect(page).to have_selector(".modal-content")
    end

    it "renders edit icon" do
      expect(page).to have_selector("a[href='/servers/#{server.name}/edit']")
    end

    it "renders close button" do
      expect(page).to have_selector("button[data-id='closeModal']")
      # expect(page).to have_button("Закрыть")
    end

    it "sets name and status in modal head" do
      expect(page.find('h4.modal-title').text).to eq "#{server.name} (#{server.server_status.name})"
    end

    context "shows structure of server in modal body" do
      let(:current_data) { page.find("#modal .modal-body table[data-id='description']").all("tr").map{ |td| td.find("td:nth-child(2)").text } }
      let(:expected_data) do
        [
          server.location,
          server.server_type.name,
          server.clusters.first.name,
          server.serial_num,
          server.inventory_num
        ]
      end

      it "shows the server data" do
        expect(current_data).to match_array(expected_data)
      end

      let(:current_structure) { page.find("#modal .modal-body table[data-id='details']").all("tr").map{ |td| td.find("td:nth-child(2)").text.to_i } }
      let(:expected_structure) { server.real_server_details.map(&:count) }

      it "shows the server structure" do
        expect(current_structure).to match_array(expected_structure)
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
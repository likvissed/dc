require 'rails_helper'

RSpec.describe "server_parts/index", type: :feature, js: true do

  let(:admin_user) { create(:admin_user) }
  let!(:server_parts) { create_list(:server_part, 5) }
  let!(:server_part) { ServerPart.first }
  before do
    login_as admin_user
    visit server_parts_path
  end

  it "renders link to delete the record" do
    expect(page).to have_selector("a[href='#{server_part_path(server_part.id)}']")
  end

  it "renders \"add\" form to redirect to the create page" do
    expect(page).to have_selector("form[action='#{new_server_part_path}']")
  end

  it "renders detail_type filter" do
    expect(page).to have_selector("select#detailTypeFilter")
  end

  context "when click on server_part row" do
    before { page.first("#servPartTable tbody tr").click }

    it "shows modal window" do
      expect(page).to have_selector(".modal-content")
    end

    it "renders edit icon" do
      expect(page).to have_selector("a[href='/server_parts/#{server_part.name}/edit']")
    end

    it "renders close button" do
      expect(page).to have_selector("button[data-id='closeModal']")
      # expect(page).to have_button("Закрыть")
    end

    it "sets type name in modal head" do
      expect(page.find('h4.modal-title').text).to eq server_part.name
    end

    context "shows structure of server_part in modal body" do
      let(:current_data) { page.find("#modal .modal-body").all("tr").map{ |td| td.find("td:nth-child(2)").text } }
      let(:expected_data) { [server_part.detail_type.name, server_part.part_num] }

      it "shows server_part data" do
        expect(current_data).to match_array(expected_data)
      end

      let(:current_comment) { page.find("#modal div[data-id='srvPartComment']").text }
      let(:expected_comment) { server_part.comment }

      it "shows comment below server_part data" do
        expect(current_comment).to eq expected_comment
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
    end
  end

  context "when filter was changed" do
    let(:filtered_data) { page.all("#servPartTable tbody td:nth-child(3)").map(&:text) }

    it "rendes only filtered data" do
      page.find("select#detailTypeFilter option[value='#{server_part.id}']").select_option
      expect(filtered_data).to contain_exactly server_part.detail_type.name
    end
  end

end
